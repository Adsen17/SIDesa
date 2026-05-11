export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`border border-gray-200 px-3 py-2 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-black ${className}`}
      {...props}
    />
  );
}