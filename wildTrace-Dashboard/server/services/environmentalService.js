import { getJsonObjects } from "./objectStorage.js";
import { transformEnvironmentalData } from "../transformers/environmentalTransformer.js";

const NAMESPACE = "TON_NAMESPACE_OCI";
const ENVIRONMENTAL_BUCKET = "wildtrace-environmental";
const COMPUTED_PREFIX = "collected/computed";

export async function getEnvironmentalCaptures() {
    console.log("[Environmental] Récupération des captures...");

    const files = await getJsonObjects({
        namespaceName: NAMESPACE,
        bucketName: ENVIRONMENTAL_BUCKET,
        prefix: COMPUTED_PREFIX,
    });

    const captures = files.flat();

    console.log(
        `[Environmental] ${captures.length} captures récupérées`
    );

    return transformEnvironmentalData(captures);
}