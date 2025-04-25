
import { useFireproof } from "use-fireproof";

// Define the Todo type to properly type our documents
interface Todo {
  _id?: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const Index = () => {
  // Remove the generic type parameter from useFireproof
  const { useLiveQuery, useDocument, database } = useFireproof("todo-list");

  const {
    doc: newTodo,
    merge: mergeNewTodo,
    submit: submitNewTodo
  } = useDocument<Todo>({
    text: "",
    completed: false,
    createdAt: Date.now()
  });

  // Use the Todo type with useLiveQuery to type the returned documents
  const { docs: todos } = useLiveQuery<Todo>("_id", { 
    descending: true 
  });

  return (
    <div className="min-h-screen bg-purple-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-purple-900 mb-6">My Todos</h1>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (newTodo.text.trim()) submitNewTodo();
          }} className="mb-6">
            <input
              type="text"
              value={newTodo.text}
              onChange={(e) => mergeNewTodo({ text: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </form>

          <ul className="space-y-3">
            {todos.map((todo) => (
              <li key={todo._id} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => database.put({ ...todo, completed: !todo.completed })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className={`ml-3 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => database.del(todo._id!)}
                  className="text-sm px-2 py-1 text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
