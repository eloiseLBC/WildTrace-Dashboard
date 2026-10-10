// This check lists one object and verifies GET access without logging its contents.
try {
  const { getObjectStorageClient, ociSettings } = await import("../config/oci.js");
  const client = getObjectStorageClient();
  const { namespaceName, bucketName, prefix } = ociSettings;
  const listed = await client.listObjects({ namespaceName, bucketName, prefix, limit: 1 });
  const first = listed.listObjects.objects?.[0];
  if (!first) {
    console.log("OCI LIST succeeded. The configured prefix is empty; GET access remains unverified.");
  } else {
    const response = await client.getObject({ namespaceName, bucketName, objectName: first.name });
    // Consume and discard the response; never print personal measurements.
    for await (const chunk of response.value) { /* discard */ }
    console.log("OCI LIST and GET succeeded for the configured daily document prefix.");
  }
} catch (error) {
  // Do not print SDK errors: they may include local paths or request details.
  const code = error?.code;
  const known = {
    NotAuthenticated: "OCI authentication failed. Check the profile, API key and region.",
    NotAuthorizedOrNotFound: "OCI access failed. Check IAM permissions, namespace, bucket and region.",
  };
  const message = error?.message || "";
  console.error(known[code] || (message.startsWith("Missing configuration:")
    ? message : "OCI check failed. Check the local OCI profile and daily bucket configuration."));
  process.exitCode = 1;
}
