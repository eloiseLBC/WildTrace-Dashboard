// Generic OCI layer: preserve object metadata, report invalid JSON, fail on network errors.
export async function readJsonObjects({ client, namespaceName, bucketName, prefix = "", concurrency = 5 }) {
  const objects = [];
  let start;
  const visited = new Set();
  do {
    const response = await client.listObjects({ namespaceName, bucketName, prefix, start, fields: "name,timeModified" });
    objects.push(...(response.listObjects.objects ?? []).filter((object) => object.name.endsWith(".json")));
    start = response.listObjects.nextStartWith;
    if (start && visited.has(start)) throw new Error("Repeated OCI pagination cursor");
    if (start) visited.add(start);
  } while (start);
  const results = new Array(objects.length);
  let next = 0;
  async function worker() {
    while (next < objects.length) {
      const index = next++;
      const object = objects[index];
      const response = await client.getObject({ namespaceName, bucketName, objectName: object.name });
      const chunks = [];
      for await (const chunk of response.value) chunks.push(Buffer.from(chunk));
      let document;
      try { document = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { results[index] = { name: object.name, invalidJson: true }; continue; }
      results[index] = { name: object.name, modifiedAt: object.timeModified, document };
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), objects.length) }, worker));
  return results;
}
