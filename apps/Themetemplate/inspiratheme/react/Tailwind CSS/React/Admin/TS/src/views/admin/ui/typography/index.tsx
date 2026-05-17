import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Typography" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-base">
          <div className="lg:col-span-6">
            <DisplayHeadings />
          </div>

          <div className="lg:col-span-2">
            <InlineTextElements />
          </div>
          <div className="lg:col-span-2">
            <Unordered />
          </div>
          <div className="lg:col-span-2">
            <Ordered />
          </div>
          <div className="lg:col-span-2">
            <Unstyled />
          </div>
          <div className="lg:col-span-2">
            <Alignment />
          </div>
          <div className="lg:col-span-2">
            <Inline />
          </div>
          <div className="lg:col-span-2">
            <NamingASource />
          </div>
          <div className="lg:col-span-4">
            <BlockQuotes />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const DisplayHeadings = () => {
  return (
    <ComponentCard title="Display Headings" isCollapsible>
      <div className="space-y-3 grid grid-cols-2">
        <h1 className="text-xs">text-xs</h1>
        <h1 className="text-sm">text-sm</h1>
        <h1 className="text-base">text-base</h1>
        <h1 className="text-lg">text-lg</h1>
        <h1 className="text-xl">text-xl</h1>
        <h1 className="text-2xl">text-2xl</h1>
        <h1 className="text-3xl">text-3xl</h1>
        <h1 className="text-4xl">text-4xl</h1>
        <h1 className="text-5xl">text-5xl</h1>
        <h1 className="text-6xl">text-6xl</h1>
        <h1 className="text-7xl">text-7xl</h1>
        <h1 className="text-8xl">text-8xl</h1>
        <h1 className="text-9xl">text-9xl</h1>
      </div>
    </ComponentCard>
  )
}

const InlineTextElements = () => {
  return (
    <ComponentCard title="Inline Text Elements" isCollapsible>
      <div className="space-y-4">
        <p className="text-default-400">Styling for common inline HTML5 elements.</p>
        <p className="text-lg font-light">Your title goes here</p>
        <p className="font-light">
          You can use the mark tag to
          <mark className="bg-warning/15 p-1">highlight</mark>
          text.
        </p>
        <p className="font-light">
          <del>This line of text is meant to be treated as deleted text.</del>
        </p>
        <p className="font-light">
          <s>This line of text is meant to be treated as no longer accurate.</s>
        </p>
        <p className="font-light">
          <ins>This line of text is meant to be treated as an addition to thedocument.</ins>
        </p>
        <p className="font-light">
          <u>This line of text will render as underlined</u>
        </p>
        <p className="font-light">
          <small>This line of text is meant to be treated as fine print.</small>
        </p>
        <p className="font-light">
          <strong>This line rendered as bold text.</strong>
        </p>
        <p className="font-light">
          <em>This line rendered as italicized text.</em>
        </p>
        <p className="mb-0 font-light">
          Nulla
          <abbr title="attribute">attr</abbr>
          vitae elit libero, a pharetra augue.
        </p>
      </div>
    </ComponentCard>
  )
}

const Unordered = () => {
  return (
    <ComponentCard title="Unordered" isCollapsible>
      <p className="text-default-400 mb-4">A list of items in which the order does not explicitly matter.</p>
      <ul className="list-inside list-disc space-y-1">
        <li>Fully responsive design</li>
        <li>Built with TailwindCSS 4 framework</li>
        <li>Clean and modern UI components</li>
        <li>Cross-browser compatibility</li>
        <li>
          Multiple form elements and validations
          <ul className="ms-10 list-inside list-disc">
            <li>Rich input controls</li>
            <li>Step-based form wizards</li>
            <li>Real-time validation</li>
            <li>Customizable styles</li>
          </ul>
        </li>
        <li>Advanced chart and graph libraries</li>
        <li>Integrated data tables and sorting</li>
        <li>Developer-friendly code structure</li>
      </ul>
    </ComponentCard>
  )
}

const Ordered = () => {
  return (
    <ComponentCard title="Ordered" isCollapsible>
      <p className="text-default-400 mb-4">A list of items in which the order does explicitly matter.</p>
      <ol className="list-inside list-decimal space-y-1">
        <li>Install all dependencies</li>
        <li>Configure project environment settings</li>
        <li>Set up folder structure and routing</li>
        <li>Integrate UI components and layout</li>
        <li>
          Implement core modules
          <ol className="ms-10 list-inside list-decimal space-y-1">
            <li>Authentication &amp; Authorization</li>
            <li>Dashboard widgets and metrics</li>
            <li>User profile management</li>
            <li>Notification &amp; messaging systems</li>
          </ol>
        </li>
        <li>Connect backend APIs and test data flow</li>
        <li>Optimize performance and responsive design</li>
        <li>Final testing and deployment</li>
      </ol>
    </ComponentCard>
  )
}

const Unstyled = () => {
  return (
    <ComponentCard title="Unstyled" isCollapsible>
      <p className="text-default-400 mb-4">
        <strong>This only applies to immediate children list items</strong>, meaning you will need to add the class for any nested lists as well.
      </p>
      <div className="space-y-4">
        <ul className="list-none">
          <li>Install project dependencies</li>
          <li>
            Configure build settings
            <ul className="list-inside list-disc">
              <li>Update environment variables</li>
            </ul>
          </li>
          <li>Setup project structure and routes</li>
          <li>Launch local development server</li>
        </ul>
        <h5>Inline List</h5>
        <p className="text-default-400">
          Display list items horizontally using
          <code>display: inline-block;</code>
          and appropriate spacing.
        </p>
        <ul className="flex items-center gap-4">
          <li className="list-inline-item">HTML</li>
          <li className="list-inline-item">CSS</li>
          <li className="list-inline-item">JavaScript</li>
        </ul>
      </div>
    </ComponentCard>
  )
}

const Alignment = () => {
  return (
    <ComponentCard title="Alignment" isCollapsible>
      <p className="text-default-400 mb-4">Use text utilities as needed to change the alignment of your blockquote.</p>
      <figure className="mb-5 text-center">
        <blockquote className="blockquote">
          <p className="mb-1 text-[17px]">&quot;Design is not just what it looks like and feels like. Design is how it works.&quot;</p>
        </blockquote>
        <figcaption className="text-default-400">
          -Steve Jobs in
          <cite title="Steve Jobs Biography">Steve Jobs Biography</cite>
        </figcaption>
      </figure>
      <figure className="text-end">
        <blockquote className="blockquote">
          <p className="mb-1 text-[17px]">&quot;Simplicity is the ultimate sophistication.&quot;</p>
        </blockquote>
        <figcaption className="text-default-400">
          Leonardo da Vinci in
          <cite title="Design Philosophy">Design Philosophy</cite>
        </figcaption>
      </figure>
    </ComponentCard>
  )
}

const Inline = () => {
  return (
    <ComponentCard title="Inline" isCollapsible>
      <p className="text-default-400 mb-4">Remove a list&apos;s bullets and apply some light margin with a combination of two classes, .list-inline and .list-inline-item.</p>
      <ul className="list-inside">
        <li>This is a list item.</li>
        <li>And another one.</li>
        <li>But they&apos;re displayed inline.</li>
      </ul>
    </ComponentCard>
  )
}

const NamingASource = () => {
  return (
    <ComponentCard title="Naming a Source" isCollapsible>
      <p className="text-default-400 mb-4">A well-known quote, contained in a blockquote element.</p>
      <figure>
        <blockquote>
          <p className="mb-1 text-lg">&quot;Design is not just what it looks like and feels like. Design is how it works.&quot;</p>
        </blockquote>
        <figcaption className="text-default-400">
          -Steve Jobs in
          <cite title="Design Philosophy">Design Philosophy</cite>
        </figcaption>
      </figure>
    </ComponentCard>
  )
}

const BlockQuotes = () => {
  return (
    <ComponentCard title="Blockquotes" isCollapsible>
      <blockquote>
        <p className="text-lg">&quot;Good design is obvious. Great design is transparent.&quot;</p>
      </blockquote>
      <figcaption className="mt-1 mb-5 text-default-400">
        — Joe Sparano in
        <cite className="italic">Design Principles</cite>
      </figcaption>
      <p className="text-default-400 mb-4">Use text utilities as needed to change the alignment of your blockquote.</p>
      <blockquote className="text-center">
        <p className="text-lg">&quot;First, solve the problem. Then, write the code.&quot;</p>
      </blockquote>
      <figcaption className="mt-1 mb-5 text-default-400 text-center">
        — John Johnson in
        <cite className="italic">Developer Wisdom</cite>
      </figcaption>
      <blockquote className="text-end">
        <p className="text-lg">&quot;Simplicity is the soul of efficiency.&quot;</p>
      </blockquote>
      <figcaption className="mt-1 mb-5 text-default-400 text-end">
        — Austin Freeman in
        <cite className="italic">Efficiency in Design</cite>
      </figcaption>
    </ComponentCard>
  )
}
