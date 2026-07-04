import NavBar from "./components/Nav";
import ToastLauncher from "./components/ToastProvider";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="p-[2px] w-screen h-screen bg-linear-to-br from-slate-900 to-blue-500 m-0 font-sans">
        <NavBar />
        <ToastLauncher />
        {children}
        <footer className="absolute left-2 top-[97.5vh] md:top-[97vh] text-slate-200 font-semibold text-[9px] md:text-[11px] md:text-sm">
          {" "}
          &copy;{" "}
          <a
            href="https://www.linkedin.com/in/daniel-yang-a17ab3229/"
            target="_blank"
            rel="noreferrer"
            className="a"
          >
            Daniel Yang
          </a>{" "}
          |{" "}
          <a
            href="https://info.avwx.rest/"
            target="_blank"
            rel="noreferrer"
            className="a"
          >
            AVWX
          </a>{" "}
          |{" "}
          <a
            href="https://skylinkapi.com/"
            target="_blank"
            rel="noreferrer"
            className="a"
          >
            SkyLink
          </a>{" "}
          |{" "}
          <a
            href="https://airlabs.co/"
            target="_blank"
            rel="noreferrer"
            className="a"
          >
            AirLabs
          </a>
        </footer>
      </body>
    </html>
  );
}
