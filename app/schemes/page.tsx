import { PageHead } from "@/components/page-head";

export default function Page() {
  return (
    <PageHead
      crumb="The Resource Ledger"
      title={<>The money is <em className="italic text-crimson">already there.</em><br />We help you reach it.</>}
      sub="A reference to the major Government of India schemes we navigate with our founders — substantial, well-funded, and chronically under-used."
    />
  );
}
