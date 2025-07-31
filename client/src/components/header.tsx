export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-hammer text-white text-lg"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BuildOrBail</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a 
              href="#validate" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('validate')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              Validate Idea
            </a>
            <a 
              href="#results" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              Past Results
            </a>
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              How It Works
            </a>
          </nav>
          <button className="md:hidden p-2 text-gray-400 hover:text-gray-600">
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
