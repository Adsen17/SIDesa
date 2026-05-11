export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}