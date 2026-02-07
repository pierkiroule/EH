export default function ScenePlayer({ scene }) {
  const url =
    import.meta.env.VITE_SUPABASE_STORAGE_URL +
    "/media/" +
    scene.scene_descriptor.audio;

  return (
    <audio controls>
      <source src={url} />
    </audio>
  );
}
