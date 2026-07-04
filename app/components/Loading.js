import Blur from "./Blur";
import Title from "./Title";

export default function Loading() {
  return (
    <>
      <Blur />
      <Title loading={true} />
    </>
  );
}
