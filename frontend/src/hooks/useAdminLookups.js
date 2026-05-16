import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { normalizeCollectionResponse } from '../lib/normalizeCollectionResponse';

const loaders = {
  filieres: adminApi.filieres,
  groups: adminApi.groups,
  modules: adminApi.modules,
  professors: adminApi.professors,
};

export const useAdminLookups = (keys = []) => {
  const [lookups, setLookups] = useState({});
  const signature = keys.join('|');

  useEffect(() => {
    let mounted = true;
    const requestedKeys = signature ? signature.split('|') : [];

    const loadLookups = async () => {
      try {
        const entries = await Promise.all(
          requestedKeys.map(async (key) => {
            const response = await loaders[key]?.();
            return [key, normalizeCollectionResponse(response)];
          })
        );

        if (mounted) {
          setLookups(Object.fromEntries(entries));
        }
      } catch (error) {
        if (mounted) {
          setLookups({});
        }
      }
    };

    if (requestedKeys.length) {
      loadLookups();
    }

    return () => {
      mounted = false;
    };
  }, [signature]);

  return lookups;
};
