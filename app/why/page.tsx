import { PageHead } from "@/components/page-head";

export default function Page() {
  return (
    <PageHead
      crumb="Why Us"
      title={<>Why students should make us their <em className="italic text-crimson">first choice.</em></>}
      sub="Not because the idea is novel — but because nobody else closes the loop."
    />
  );
}
