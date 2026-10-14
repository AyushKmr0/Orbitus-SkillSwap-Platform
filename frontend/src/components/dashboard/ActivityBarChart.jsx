import React from "react";
import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

export default function ActivityBarChart({ chartData, chartOptions }) {
	return (
		<div className="w-full h-full min-h-[200px]">
			<Bar data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
		</div>
	);
}
