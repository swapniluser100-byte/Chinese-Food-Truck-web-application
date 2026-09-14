import { Outlet } from "react-router-dom";
import { useReadyAlerts } from "../../hooks/useReadyAlerts";
import { ReadyAlertModal } from "../../components/ReadyAlertModal";

// Wraps every staff-facing page (Menu, New Order, Active Orders) so a ready
// order alerts whoever's looking at the phone/tablet, regardless of which
// staff tab happens to be open at the time.
export function StaffLayout() {
  const { readyAlerts, dismiss } = useReadyAlerts();

  return (
    <>
      <ReadyAlertModal orders={readyAlerts} onDismiss={dismiss} />
      <Outlet />
    </>
  );
}
