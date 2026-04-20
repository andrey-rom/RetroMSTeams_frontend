import { useEffect, useState } from "react";
import { getUserId } from "../../../shared/lib/api-client.ts";
import { generateOwnerHash } from "../../../shared/lib/hash.ts";

export function useMyOwnerHash(sessionId: string | undefined): null | string {
  const [hash, setHash] = useState<null | string>(null);

  useEffect(() => {
    if (!sessionId) {
      setHash(null);

      return;
    }
    let cancelled = false;

    generateOwnerHash(getUserId(), sessionId).then((h) => {
      if (!cancelled) {
        setHash(h);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return hash;
}
