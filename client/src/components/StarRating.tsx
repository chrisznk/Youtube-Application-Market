import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  generationId: number;
  initialRating?: number | null;
  onRate: (generationId: number, rating: number) => void;
}

export function StarRating({ generationId, initialRating, onRate }: StarRatingProps) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hover, setHover] = useState(0);

  const handleClick = (value: number) => {
    setRating(value);
    onRate(generationId, value);
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating}/5
        </span>
      )}
    </div>
  );
}
