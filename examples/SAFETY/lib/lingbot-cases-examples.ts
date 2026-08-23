import type { StructuredExample } from "@/lib/lingbot-world-prompts";

import hospitalEmergencyCapacity from "./lingbot-cases/hospital-emergency-capacity.json";
import hospitalEmergencyIcu from "./lingbot-cases/hospital-emergency-icu.json";
import medicineDeliveryDrone from "./lingbot-cases/medicine-delivery-drone.json";

// The display order of the emergency healthcare use cases.
export const LINGBOT_CASES_EXAMPLE_LIST: StructuredExample[] = [
  hospitalEmergencyCapacity,
  hospitalEmergencyIcu,
  medicineDeliveryDrone,
] as unknown as StructuredExample[];
