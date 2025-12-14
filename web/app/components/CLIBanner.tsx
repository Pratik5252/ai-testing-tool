interface CLIBannerProps {
  version?: string;
}

export default function CLIBanner({ version }: CLIBannerProps) {
  return (
    <div className="w-full max-w-4xl mx-auto font-mono text-sm leading-tight">
      {/* ASCII Art Banner */}
      <pre className="text-cyan-400 text-xs sm:text-sm lg:text-base overflow-x-auto whitespace-pre">
{`
 ██████╗ ████████╗███████╗███████╗████████╗       ██████╗██╗     ██╗
██╔═══██╗╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝      ██╔════╝██║     ██║
██║   ██║   ██║   █████╗  ███████╗   ██║   █████╗██║     ██║     ██║
██║▄▄ ██║   ██║   ██╔══╝  ╚════██║   ██║   ╚════╝██║     ██║     ██║
╚██████╔╝   ██║   ███████╗███████║   ██║         ╚██████╗███████╗██║
 ╚══▀▀═╝    ╚═╝   ╚══════╝╚══════╝   ╚═╝          ╚═════╝╚══════╝╚═╝
`}
      </pre>
    </div>
  );
}