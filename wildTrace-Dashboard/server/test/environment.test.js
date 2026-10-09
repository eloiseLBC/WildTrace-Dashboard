import test from "node:test";
import assert from "node:assert/strict";
import { homedir } from "node:os";
import { readOciSettings } from "../config/environment.js";

const valid = { OCI_NAMESPACE: " ns ", OCI_DAILY_BUCKET: " daily ", OCI_DAILY_PREFIX: "daily/" };
test("daily source is required and whitespace is normalized", () => {
  const settings = readOciSettings(valid);
  assert.equal(settings.namespaceName, "ns");
  assert.equal(settings.bucketName, "daily");
  assert.equal(settings.profile, "DEFAULT");
  for (const key of ["OCI_NAMESPACE", "OCI_DAILY_BUCKET"]) {
    assert.throws(() => readOciSettings({ ...valid, [key]: " " }), new RegExp(key));
  }
});
test("profile and home-relative config paths are honored", () => {
  const settings = readOciSettings({ ...valid, OCI_CONFIG_PROFILE: " WILDTRACE ", OCI_CONFIG_FILE: "~/.oci/config" });
  assert.equal(settings.profile, "WILDTRACE");
  assert.equal(settings.configFile, homedir() + "/.oci/config");
});

test("empty or omitted prefix reads from the bucket root", () => {
  assert.equal(readOciSettings({ ...valid, OCI_DAILY_PREFIX: "" }).prefix, "");
  assert.equal(readOciSettings({ ...valid, OCI_DAILY_PREFIX: undefined }).prefix, "");
});
