import * as common from "oci-common";
import * as objectstorage from "oci-objectstorage";
import { readOciSettings } from "./environment.js";

export const ociSettings = readOciSettings();
let client;

// Lazy creation keeps authentication errors inside the caller's error handling.
export function getObjectStorageClient() {
  if (!client) {
    const provider = new common.ConfigFileAuthenticationDetailsProvider(
      ociSettings.configFile,
      ociSettings.profile
    );
    client = new objectstorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
  }
  return client;
}

// Preserve compatibility with the existing Object Storage service.
export const objectStorageClient = {
  listObjects: (request) => getObjectStorageClient().listObjects(request),
  getObject: (request) => getObjectStorageClient().getObject(request),
};
