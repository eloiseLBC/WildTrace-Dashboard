# Local OCI configuration

This first step configures the server SDK and provides a real LIST/GET connection check.
The server now also exposes the shared daily document API used by the environmental, biological
and insights pages. Run npm run dev in this server directory and start Vite in a second terminal.
The old environmental source constants have been removed. See the repository local-development.md
for API URL, CORS and cache settings.

## Setup

Requires Node.js 20.12 or newer. From the repository root:

```bash
# If .env already exists, keep it and add any missing settings.
# Create it from the template only if it does not exist.
cd wildTrace-Dashboard/server
npm ci
npm test
npm run check:oci
```

Edit the application .env with OCI_NAMESPACE, OCI_DAILY_BUCKET and OCI_DAILY_PREFIX.
These values identify the consolidated daily documents, not the raw capture files.
OCI_CONFIG_PROFILE defaults to DEFAULT. OCI_CONFIG_FILE defaults to the SDK path
~/.oci/config. The file is loaded relative to the application; exported environment
variables take precedence. Restart the command after changing configuration.

If needed, run `oci setup config` with an installed OCI CLI, or configure the
SDK file manually using the official guide. A profile includes:

```ini
[DEFAULT]
user=<user OCID>
fingerprint=<API key fingerprint>
tenancy=<tenancy OCID>
region=<bucket region>
key_file=<absolute path to the private key>
```

Register the matching public API key for the OCI user. Never commit the private key.
The SDK does not require the CLI to execute requests.

## IAM

The user must belong to a group authorized to list and read objects. A policy template
for an administrator to adapt is:

```text
Allow group <group-name> to read objects in compartment <compartment-name> where target.bucket.name = '<daily-bucket-name>'
```

Verify the compartment, bucket and identity in your tenancy before applying it.
No upload or deletion permission is required for this step.

## Verification

The check lists at most one object under the configured prefix and downloads it,
discarding its content. Success verifies authentication, LIST and GET for that object.
An empty prefix proves LIST only. It does not validate the document schema, pagination,
or all objects. It never prints biological data or credentials.

Configuration tests do not require OCI credentials. A real connection check requires
your local profile and bucket settings. A health endpoint alone is not a connection test.

Official references:
- [SDK configuration](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm)
- [Authentication provider](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/classes/_common_lib_auth_config_file_auth_.configfileauthenticationdetailsprovider.html)
- [Object Storage policies](https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/objectstoragepolicyreference.htm)
