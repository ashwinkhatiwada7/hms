import React, { Suspense } from "react";
import Account from "./_components/account";

export default function Page() {
  return (
    <div>
      <Suspense fallback={"loading..."}>
        <Account />
      </Suspense>
    </div>
  );
}
