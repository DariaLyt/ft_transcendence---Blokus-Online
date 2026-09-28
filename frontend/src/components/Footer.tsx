import { Link } from "react-router-dom";

export default function Footer() {
	return (
		<footer className="py-6 text-sm text-slate-500 text-center">
			<Link to="/privacy" className="hover:text-blue-600 hover:underline"> Privacy Policy </Link>
			<Link to="/terms" className="hover:text-blue-600 hover:underline"> Terms of Service </Link>
		</footer>
	);
}