import { PageHead } from "@/components/page-head";

export default function Page() {
  return (
    <PageHead
      crumb="The Roadmap"
      title={<>Evidence before <em className="italic text-crimson">expenditure.</em></>}
      sub="We build nothing until real founders prove it worth building. This is the discipline we practise — and the discipline we teach."
    />
  );
}
