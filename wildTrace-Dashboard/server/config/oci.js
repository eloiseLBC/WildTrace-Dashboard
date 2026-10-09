import * as common from "oci-common";
import * as objectstorage from "oci-objectstorage";

// En développement local, le SDK utilise le profil DEFAULT
// créé dans ~/.oci/config par `oci setup config`.
const provider = new common.ConfigFileAuthenticationDetailsProvider(
    undefined,
    "DEFAULT"
);

const objectStorageClient = new objectstorage.ObjectStorageClient({
    authenticationDetailsProvider: provider,
});

export { objectStorageClient };