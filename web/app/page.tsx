import CLIBanner from './components/CLIBanner';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="w-full bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-mono text-lg flex items-center gap-1">
              <span>➜</span>
              <span>[qtest-cli]</span>
              <span className="animate-pulse">_</span>
            </div>
            <a 
              href="#docs" 
              className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-800/50 font-mono"
            >
              <span>{'>'}</span>
              <span>docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-4xl mx-auto text-center">
          {/* Tool Description */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-300 mb-6">
              Write Code, We'll Write Tests ✨
            </h2>
            
            {/* Terminal with Banner */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-black border border-gray-700 rounded-lg overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-gray-400 text-sm font-mono ml-4">
                    terminal
                  </div>
                </div>
                
                {/* Terminal Content */}
                <div className="p-6 font-mono text-left space-y-4">
                  {/* Banner inside terminal */}
                  <pre className="text-cyan-400 text-xs sm:text-sm overflow-x-auto whitespace-pre">
{`
 ██████╗ ████████╗███████╗███████╗████████╗       ██████╗██╗     ██╗
██╔═══██╗╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝      ██╔════╝██║     ██║
██║   ██║   ██║   █████╗  ███████╗   ██║   █████╗██║     ██║     ██║
██║▄▄ ██║   ██║   ██╔══╝  ╚════██║   ██║   ╚════╝██║     ██║     ██║
╚██████╔╝   ██║   ███████╗███████║   ██║         ╚██████╗███████╗██║
 ╚══▀▀═╝    ╚═╝   ╚══════╝╚══════╝   ╚═╝          ╚═════╝╚══════╝╚═╝
`}
                  </pre>
                  
                  {/* Command lines */}
                  <div className="space-y-3 text-sm">
                    <div className="text-gray-300">
                      <span className="text-green-400">➜</span>
                      <span className="text-blue-400 ml-2">~</span>
                      <span className="text-gray-300 ml-2">npm install -g qtest-cli</span>
                    </div>
                    <div className="text-gray-500 ml-4">
                      ✓ qtest-cli installed successfully
                    </div>
                    <div className="text-gray-300">
                      <span className="text-green-400">➜</span>
                      <span className="text-blue-400 ml-2">~</span>
                      <span className="text-gray-300 ml-2">qtest analyze</span>
                    </div>
                    <div className="text-cyan-400 ml-4">
                      🤖 Analyzing your code...
                    </div>
                    <div className="text-cyan-400 ml-4">
                      🧪 Generating tests...
                    </div>
                    <div className="text-green-400 ml-4">
                      ✓ Tests generated successfully!
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center space-y-3">
                <div className="text-4xl">🤖</div>
                <h3 className="text-white font-semibold">AI-Powered</h3>
                <p className="text-gray-400 text-sm">
                  Generate comprehensive tests using advanced AI algorithms
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="text-4xl">🧪</div>
                <h3 className="text-white font-semibold">Multi-Framework</h3>
                <p className="text-gray-400 text-sm">
                  Support for Jest, Vitest, and Mocha testing frameworks
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="text-4xl">⚡</div>
                <h3 className="text-white font-semibold">Lightning Fast</h3>
                <p className="text-gray-400 text-sm">
                  Generate tests in seconds, not hours
                </p>
              </div>
            </div>
            
            {/* Made with love */}
            <div className="mt-24 text-center">
              <p className="text-gray-500 text-sm">
                Made with ❤️ by pratik
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
