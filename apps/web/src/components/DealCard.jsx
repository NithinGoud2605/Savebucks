export default function DealCard({ deal }) {
  return (
    <article className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{deal.title}</h3>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{deal.merchant ?? 'Merchant'}</div>
      <div className="mt-2 flex items-center gap-3 text-sm">
        {deal.price ? <span className="font-medium">${deal.price}</span> : null}
        <span className="text-zinc-500">•</span>
        <span>{new Date(deal.created * 1000).toLocaleString()}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white">Upvote</button>
        <a className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700" href={deal.url} target="_blank" rel="noreferrer">Go to deal</a>
      </div>
    </article>
  );
}
