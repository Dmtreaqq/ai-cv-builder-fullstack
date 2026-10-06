// @nestjs/throttler is CommonJS and require()s the ESM-only Nest packages. Loading them first lets
// Jest hand over the evaluated modules instead of failing with ERR_REQUIRE_CYCLE_MODULE.
import '@nestjs/common';
import '@nestjs/core';
