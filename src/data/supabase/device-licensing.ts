import { invokeAuthenticatedFunction } from "@/data/supabase/authenticated-api";
import { createDeviceRegistration, type DeviceLicenseResult } from "@/domain/accounts/device-license";

export async function registerCurrentDevice() {
  const registration = await createDeviceRegistration();
  return invokeAuthenticatedFunction<DeviceLicenseResult>("register-device", registration);
}
