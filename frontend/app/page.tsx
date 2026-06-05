import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">BikeFix</h1>
        
        <p className="text-xl text-gray-700 mb-8">
          Найдите опытного механика для ремонта вашего велосипеда.
          Быстро, надежно и удобно.
        </p>

        <p className="text-gray-600 mb-12 text-lg">
          Загрузите фото поломки, получите предложения от механиков и выберите лучшее.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Войти
          </Link>
          
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Регистрация
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📸 Загрузите фото</h3>
            <p className="text-gray-600">Сфотографируйте проблему с велосипедом</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Получите предложения</h3>
            <p className="text-gray-600">Механики предложат свои услуги и цены</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Выберите лучшее</h3>
            <p className="text-gray-600">Общайтесь и выбирайте удобный вариант</p>
          </div>
        </div>
      </div>
    </main>
  );
}
