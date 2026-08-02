export default function ImageGallery({ images }) {
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96 rounded-2xl overflow-hidden">
      <img src={images[0]} className="col-span-2 row-span-2 w-full h-full object-cover" />
      {images.slice(1, 5).map((img, i) => (
        <img key={i} src={img} className="w-full h-full object-cover" />
      ))}
    </div>
  );
}