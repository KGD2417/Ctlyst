import { PageHead } from "@/components/page-head";

export default function Page() {
  return (
    <PageHead
      crumb="The Model"
      title={<>Not another directory.<br />A <em className="italic text-crimson">done-with-you</em> ecosystem.</>}
      sub="CTLYST begins as a curated, human-run service and evolves into a platform — because trust is built by hand before it is built by software."
    />
  );
}
