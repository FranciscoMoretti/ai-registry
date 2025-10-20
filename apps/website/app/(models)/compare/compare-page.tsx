'use client';

import { allModels, type ModelDefinition } from '@ai-registry/vercel-gateway';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ModelDetails } from '@/app/(models)/models/model-details';
import { Container } from '@/components/container';

export default function ComparePage() {
  const params = useParams<{ slug?: string[] | string }>();

  const segments = useMemo(() => {
    const raw = params?.slug;
    if (!raw) {
      return [] as string[];
    }
    if (Array.isArray(raw)) {
      return raw;
    }
    return [raw];
  }, [params]);

  const [leftModelId, setLeftModelId] = useState<string | null>(() =>
    segments.length >= 2 ? `${segments[0]}/${segments[1]}` : null,
  );

  const [rightModelId, setRightModelId] = useState<string | null>(() =>
    segments.length >= 4 ? `${segments[2]}/${segments[3]}` : null,
  );

  const leftModel: ModelDefinition | null = useMemo(() => {
    if (!leftModelId) {
      return null;
    }
    return allModels.find((m) => m.id === leftModelId) || null;
  }, [leftModelId]);

  const rightModel: ModelDefinition | null = useMemo(() => {
    if (!rightModelId) {
      return null;
    }
    return allModels.find((m) => m.id === rightModelId) || null;
  }, [rightModelId]);

  function pushCompareUrl(leftId: string | null, rightId: string | null) {
    const parts: string[] = [];
    const pushId = (id: string) => {
      const [a, b] = id.split('/');
      if (a && b) {
        parts.push(a, b);
      }
    };
    if (leftId) {
      pushId(leftId);
    }
    if (rightId) {
      pushId(rightId);
    }
    const path = parts.length > 0 ? `/compare/${parts.join('/')}` : '/compare';
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  }

  function handleLeftChange(nextId: string) {
    setLeftModelId(nextId);
    pushCompareUrl(nextId, rightModelId);
  }

  function handleRightChange(nextId: string) {
    setRightModelId(nextId);
    pushCompareUrl(leftModelId, nextId);
  }

  return (
    <Container className="p-6">
      <div className="mx-auto mb-6 flex max-w-[450px] flex-col gap-4 lg:max-w-none">
        <h1 className="font-semibold text-2xl">Compare Models</h1>
      </div>
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModelDetails
          className="mx-auto"
          enabledActions={{ goToModel: true, chat: true, compare: false }}
          modelDefinition={leftModel}
          onModelChangeAction={handleLeftChange}
        />
        <ModelDetails
          className="mx-auto"
          enabledActions={{ goToModel: true, chat: true, compare: false }}
          modelDefinition={rightModel}
          onModelChangeAction={handleRightChange}
        />
      </div>
    </Container>
  );
}
