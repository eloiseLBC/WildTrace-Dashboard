import { useEffect, useState } from "react";
import { dashboardLoaders } from "./dashboardLoaders.js";
export function useDashboardData(loaders = dashboardLoaders, { from, to, locationId } = {}) {
  const load = loaders?.loadDashboard ?? dashboardLoaders.loadDashboard;
  const [state, setState] = useState({ data: null, meta: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (from && to && from > to) return;
    const controller = new AbortController();
    setState({ data: null, meta: null, error: null, loading: true });
    load({ signal: controller.signal, from, to, locationId }).then((result) => {
      if (!controller.signal.aborted) setState({ ...result, error: null, loading: false });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ data: null, meta: null, error: error.message, loading: false });
    });
    return () => controller.abort();
  }, [load, revision, from, to, locationId]);
  return { ...state, reload: () => setRevision((value) => value + 1) };
}
