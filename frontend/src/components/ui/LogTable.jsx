export function LogTable({ logs }) {
  return (
    <div className="overflow-x-auto bg-gray-800 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 border-b border-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Time</th>
            <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Class</th>
            <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Confidence</th>
            <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">BBox</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {logs?.slice().reverse().map((log, i) => (
            <tr key={i} className="hover:bg-gray-700/50">
              <td className="px-4 py-2 text-gray-300 font-mono text-xs">
                {new Date(log.timestamp).toLocaleTimeString()}
              </td>
              <td className="px-4 py-2 text-green-400">{log.class}</td>
              <td className="px-4 py-2 text-blue-400">{(log.confidence * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                [{log.bbox?.map(v => v.toFixed(2)).join(', ')}]
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}