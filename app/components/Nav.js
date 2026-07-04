import Search from "./Search";
import { Suspense } from "react";
import Title from "./Title";

export default function NavBar() {
  return (
    <div className="relative flex mt-[1vh] mb-[2vh] w-full">
      <Title />
      <Suspense fallback={<p>Loading Search...</p>}>
        <Search />
      </Suspense>
    </div>
  );
}
