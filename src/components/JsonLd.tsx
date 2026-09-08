import type { JsonLdObject } from '@/lib/jsonld';

type Props = {
  data: JsonLdObject;
};

/**
 * Emits structured data without allowing a value to terminate the script tag.
 */
export function JsonLd({ data }: Props) {
  const serialized = JSON.stringify(data);

  if (!serialized) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized.replace(/</g, '\\u003c') }}
    />
  );
}
