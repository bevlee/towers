import type { RoomInfo } from '@towers/shared'

interface GameListProps {
  rooms: RoomInfo[]
  onJoin: (roomId: string) => void
  currentRoom: RoomInfo | null
}

export function GameList({ rooms, onJoin, currentRoom }: GameListProps) {
  if (rooms.length === 0) {
    return (
      <div className="rounded border border-stone-700 bg-stone-800/50 px-6 py-8 text-center text-stone-500">
        No open games. Create a challenge to get started!
      </div>
    )
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-stone-700 text-left text-sm text-stone-400">
          <th className="px-4 py-2">Host</th>
          <th className="px-4 py-2">Timer</th>
          <th className="px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room) => (
          <tr key={room.id} className="border-b border-stone-700/50 hover:bg-stone-800/50">
            <td className="px-4 py-3 text-amber-100">
              {room.player1?.username ?? 'Empty'}
            </td>
            <td className="px-4 py-3 text-stone-400">{room.turnTimer}s</td>
            <td className="px-4 py-3">
              {currentRoom?.id === room.id ? (
                <span className="text-sm text-stone-500">Your room</span>
              ) : currentRoom ? (
                <span className="text-sm text-stone-500">—</span>
              ) : (
                <button
                  className="rounded bg-amber-600 px-3 py-1 text-sm font-bold text-white hover:bg-amber-500"
                  onClick={() => onJoin(room.id)}
                >
                  Join
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
