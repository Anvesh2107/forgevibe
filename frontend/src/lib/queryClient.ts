import { QueryClient } from "@tanstack/react-query";

// Works locally (relative '') AND after deploy (__PORT_5000__ is replaced with proxy path)
const API_BASE = '__PORT_5000__'.startsWith('__') ? '' : '__PORT_5000__';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  return res;
}

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const url = Array.isArray(queryKey) ? (queryKey[0] as string) : (queryKey as string);
  const params = Array.isArray(queryKey) && queryKey.length > 1 && typeof queryKey[1] === "object"
    ? queryKey[1] as Record<string, string>
    : {};
  const searchParams = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
  );
  const fullUrl = `${API_BASE}${url}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});
