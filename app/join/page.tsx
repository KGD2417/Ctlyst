import { PageHead } from "@/components/page-head";

export default function Page() {
  return (
    <PageHead
      crumb="Join Us"
      title={<>Tell us where you are <em className="italic text-crimson">stuck.</em></>}
      sub="Founders, mentors, and institutions — this is the front door. Write plainly; we read everything."
    />
  );
}
