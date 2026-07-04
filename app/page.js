import All from "./components/All";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const flightNo = await params.flightno;
  const route = await params.route;

  return <All flightNo={flightNo} route={route} />;
}
export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  const title =
    params.flightno || params.route
      ? params.flightno
        ? `${params.flightno.toUpperCase()} | VecA0`
        : `${params.route.split(",")[0].toUpperCase()} - ${params.route.split(",")[1].toUpperCase()} | VecA0`
      : "VecA0";

  return {
    title: title,
  };
};
