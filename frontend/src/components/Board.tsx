export default function Board() {
	const totalCells = 20 * 20;
	const cells = Array.from({length: totalCells});

	return (
		<div className="bg-white border border-slate-200 shadow-md p-4 rounded-2xl aspect-square h-full">
			<div className="grid grid-cols-20 bg-slate-300 gap-0.5 p-1 border border-slate-300/80 shadow-inner">
				{cells.map((_, index) => (
					<div key={index}  className="w-full aspect-square bg-white" />
				))}
			</div>
		</div>
	);
}