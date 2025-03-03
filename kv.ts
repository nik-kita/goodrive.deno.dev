export const kv = await Deno.openKv();

export async function __drop__all__data__in__kv__() {
    for await (const entry of kv.list({ prefix: [] })) {
        await kv.delete(entry.key);
    }
}
