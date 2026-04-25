import { isInIframe } from "@/components/ErrorBoundary";

const sendErrorToParent = (
  message: string,
  status?: number,
  endpoint?: string,
) => {
  console.error(`[FetchWrapper] ${message}`, { status, endpoint });

  if (isInIframe()) {
    window.parent.postMessage(
      {
        source: "architect-child-app",
        type: "CHILD_APP_ERROR",
        payload: {
          type: status && status >= 500 ? "api_error" : "network_error",
          message,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          endpoint,
          status,
        },
      },
      "*",
    );
  }
};

const fetchWrapper = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  try {
    const response = await fetch(...args);

    // if backend sent a redirect
    if (response.redirected) {
      window.location.href = response.url;
      return response;
    }

    // Tool authentication required on /api/agent - inspect body for tool_auth keyword
    const requestUrl = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
    if (requestUrl.includes("/api/agent")) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const cloned = response.clone();
        try {
          const body = await cloned.json();
          const bodyStr = JSON.stringify(body);
          if (bodyStr.includes("tool_auth") && isInIframe()) {
            const detail = body?.detail;
            const errorStr = body?.error || body?.response?.message || "";

            const toolName = detail?.tool_name || errorStr.match?.(/['"]tool_name['"]:\s*['"]([^'"]+)['"]/)?.[1];
            const toolSource = detail?.tool_source || errorStr.match?.(/['"]tool_source['"]:\s*['"]([^'"]+)['"]/)?.[1];
            const reason = detail?.reason || errorStr.match?.(/['"]reason['"]:\s*['"]([^'"]+)['"]/)?.[1];
            const actionNames = detail?.action_names || (() => {
              const raw = errorStr.match?.(/['"]action_names['"]:\s*\[([^\]]+)\]/)?.[1];
              return raw ? raw.match(/['"]([^'"]+)['"]/g)?.map((s: string) => s.replace(/['"]/g, "")) : undefined;
            })();

            window.parent.postMessage(
              {
                source: "architect-child-app",
                type: "TOOL_AUTH_REQUIRED",
                payload: {
                  tool_name: toolName,
                  tool_source: toolSource,
                  action_names: actionNames,
                  reason: reason,
                },
              },
              "*",
            );
          }
        } catch {
          // JSON parse failed, ignore
        }
      }
    }

    if (response.status == 404) {
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        const html = await response.text();
        document.open();
        document.write(html);
        document.close();
        return response;
      } else {
        const reqUrl = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
        sendErrorToParent(
          `Backend returned 404 Not Found for ${reqUrl}`,
          404,
          reqUrl,
        );
      }
    } else if (response.status >= 500) {
      const reqUrl = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
      sendErrorToParent(
        `Backend returned ${response.status} error for ${reqUrl}`,
        response.status,
        reqUrl,
      );
    }

    return response;
  } catch (error) {
    const requestUrl = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
    sendErrorToParent(
      `Network error: Cannot connect to backend (${requestUrl})`,
      undefined,
      requestUrl,
    );
    throw error;
  }
};

export default fetchWrapper;
