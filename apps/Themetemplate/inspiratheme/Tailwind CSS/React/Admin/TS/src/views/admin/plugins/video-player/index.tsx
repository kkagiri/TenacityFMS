import PageBreadcrumb from '@/components/PageBreadcrumb'
import ReactPlayer from 'react-player'

export const dynamic = 'force-dynamic'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Video Player" subtitle="Plugins" />
      <div className="grid xl:grid-cols-2 gap-base">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Basic MP4 Video Player</h4>
          </div>
          <div className="card-body">
            <div className="h-[420px]">
              <ReactPlayer light="https://media.w3.org/2010/05/sintel/poster.png" className="plyr w-full!" height={420} controls src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Autoplay (muted), Loop Video Player</h4>
          </div>
          <div className="card-body">
            <div className="h-[420px]">
              <ReactPlayer className="plyr w-full!" light="https://media.w3.org/2010/05/sintel/poster.png" height={420} controls loop muted playing src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">YouTube Video Player</h4>
          </div>
          <div className="card-body">
            <div className="h-[420px]">
              <ReactPlayer light="https://media.w3.org/2010/05/sintel/poster.png" className="plyr w-full!" height={420} controls src="https://youtu.be/2jmiNO3jwrA?si=nJtopWJfV8xW18J6" config={{ youtube: { color: 'white' } }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Vimeo Video Player</h4>
          </div>
          <div className="card-body">
            <div className="h-[420px]">
              <ReactPlayer src="https://vimeo.com/76979871" controls className="plyr w-full! h-full!" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Audio Player</h4>
          </div>
          <div className="card-body">
            <audio className="w-full!" id="player-audio" controls>
              <source src="https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.mp3" type="audio/mp3" />
              <source src="https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.ogg" type="audio/ogg" />
            </audio>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
