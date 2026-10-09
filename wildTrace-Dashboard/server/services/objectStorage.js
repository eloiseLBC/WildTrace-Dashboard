import { objectStorageClient } from "../config/oci.js";

/**
 * Récupère tous les fichiers JSON correspondant à un prefix
 * dans un bucket OCI.
 */
export async function getJsonObjects({
                                         namespaceName,
                                         bucketName,
                                         prefix = "",
                                     }) {
    console.log(`[OCI] Listing du bucket "${bucketName}"...`);

    const listResponse = await objectStorageClient.listObjects({
        namespaceName,
        bucketName,
        prefix,
    });

    const objects = listResponse.listObjects.objects ?? [];

    const jsonObjects = objects.filter((object) =>
        object.name.endsWith(".json")
    );

    console.log(
        `[OCI] ${jsonObjects.length} fichiers JSON trouvés dans "${bucketName}"`
    );

    const results = await Promise.all(
        jsonObjects.map(async (object) => {
            const response = await objectStorageClient.getObject({
                namespaceName,
                bucketName,
                objectName: object.name,
            });

            const chunks = [];

            for await (const chunk of response.value) {
                chunks.push(Buffer.from(chunk));
            }

            const content = Buffer.concat(chunks).toString("utf-8");

            try {
                return JSON.parse(content);
            } catch (error) {
                console.error(
                    `[OCI] JSON invalide : ${object.name}`,
                    error
                );

                return null;
            }
        })
    );

    // Retire les éventuels fichiers invalides.
    return results.filter((result) => result !== null);
}