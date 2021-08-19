import next, { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comments from '../../components/Comments';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  next_previous: {
    uid: string;
    title: string;
  }[];
}

export default function Post({ post, next_previous }: PostProps): JSX.Element {
  function getIndex(): number {
    if (next_previous) {
      const index = next_previous.findIndex(result => result.uid === post.uid);
      return index;
    }
    return null;
  }

  const index = getIndex();
  console.log(next_previous?.length);
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function timer(): number {
    const time = post.data.content.reduce(
      (acc, body) => {
        acc.bodyLength += RichText.asText(body.body).split(' ').length - 1;
        acc.headingLength += body.heading.split(' ').length - 1;
        acc.total = Math.ceil((acc.bodyLength + acc.headingLength) / 200);
        return acc;
      },
      { bodyLength: 0, headingLength: 0, total: 0 }
    );

    return time.total;
  }

  return (
    <>
      <Header />
      <main className={styles.postContainer}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <div className={styles.postInfo}>
          <h1>{post.data.title}</h1>
          <div>
            <FiCalendar />
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{timer()} min</span>
          </div>
        </div>
        <div className={styles.postContent}>
          {post.data.content.map(result => {
            return (
              <div key={result.heading}>
                <h1>{result.heading}</h1>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(result.body),
                  }}
                />
              </div>
            );
          })}
          <div className={styles.divider} />
        </div>

        <div className={styles.postComments}>
          <div className={styles.buttonsContainer}>
            <div>
              {index !== 0 ? (
                <>
                  <p>{next_previous[index - 1].title}</p>
                  <Link href={`${next_previous[index - 1].uid}`}>
                    <a>Próximo post</a>
                  </Link>
                  )
                </>
              ) : (
                <>
                  <Link href="/">
                    <a>Home</a>
                  </Link>
                  )
                </>
              )}
            </div>
            <div>
              {index !== next_previous.length - 1 ? (
                <>
                  <p>{next_previous[index + 1].title}</p>
                  <Link href={`${next_previous[index + 1].uid}`}>
                    <a>Próximo post</a>
                  </Link>
                  )
                </>
              ) : (
                <>
                  <Link href="/">
                    <a>Home</a>
                  </Link>
                  )
                </>
              )}
            </div>
          </div>
          <Comments />
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 2 }
  );

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('post', String(slug), {});
  const response_for_slugs = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  );

  const next_previous = response_for_slugs.results.map(result => {
    return {
      uid: result.uid,
      title: result.data.title,
    };
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(result => {
        return {
          heading: result.heading,
          body: result.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
      next_previous,
    },
    revalidate: 60 * 60,
  };
};
