import { Controller, Get, SetMetadata } from "@nestjs/common";
@Controller("health")
export class HealthController {
  @Get()
  @SetMetadata("public", true)
  check() {
    return { status: "ok" };
  }
}
