'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
}

export default function AttendanceSparkline({ data, color = "#006A67" }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="w-full h-[40px] min-h-[40px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[0, 100]} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
