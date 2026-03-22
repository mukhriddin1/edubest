import { Link } from 'react-router-dom';

const PLANS = [
  { name: 'Демо', price: 'Бесплатно', features: ['10 вопросов', 'Без сохранения', 'Только математика'] },
  { name: 'Абитуриент', price: '990 сом/мес', features: ['Все разделы ОРТ', 'Полная статистика', 'Геймификация', 'Анализ ошибок'], featured: true },
  { name: 'Сезонный', price: '2500 сом/3 мес', features: ['Всё из Абитуриент', 'Скидка 15%', 'Приоритетная поддержка'] },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-16">
      <h1 className="text-4xl font-black text-center mb-12">Тарифы</h1>
      <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
        {PLANS.map(p => (
          <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? 'border-amber-400 bg-amber-400/5' : 'border-slate-800 bg-slate-900'}`}>
            <h2 className="text-xl font-bold mb-1">{p.name}</h2>
            <p className={`text-2xl font-black mb-4 ${p.featured ? 'text-amber-400' : 'text-white'}`}>{p.price}</p>
            <ul className="space-y-2 mb-6">
              {p.features.map(f => <li key={f} className="text-slate-400 text-sm flex gap-2"><span className="text-emerald-400">✓</span>{f}</li>)}
            </ul>
            <Link to="/register" className={`block text-center font-bold py-2 rounded-xl transition ${p.featured ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
              Начать
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
